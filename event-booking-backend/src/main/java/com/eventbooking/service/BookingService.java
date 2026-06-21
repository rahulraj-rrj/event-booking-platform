package com.eventbooking.service;

import com.eventbooking.dto.BookingRequest;
import com.eventbooking.dto.BookingResponse;
import com.eventbooking.dto.BookingSeatInfo;
import com.eventbooking.entity.Booking;
import com.eventbooking.entity.BookingStatus;
import com.eventbooking.entity.Event;
import com.eventbooking.entity.EventSeat;
import com.eventbooking.entity.Payment;
import com.eventbooking.entity.PaymentStatus;
import com.eventbooking.entity.Role;
import com.eventbooking.entity.SeatStatus;
import com.eventbooking.entity.User;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.exception.SeatUnavailableException;
import com.eventbooking.repository.BookingRepository;
import com.eventbooking.repository.EventRepository;
import com.eventbooking.repository.EventSeatRepository;
import com.eventbooking.repository.PaymentRepository;
import com.eventbooking.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User user = currentUserProvider.getCurrentUser();
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + request.getEventId()));

        List<EventSeat> seatsToLock = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (UUID eventSeatId : request.getEventSeatIds()) {
            EventSeat eventSeat = eventSeatRepository.findById(eventSeatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seat not found with id: " + eventSeatId));

            if (!eventSeat.getEvent().getId().equals(event.getId())) {
                throw new IllegalArgumentException("Seat " + eventSeatId + " does not belong to this event");
            }

            if (eventSeat.getStatus() != SeatStatus.AVAILABLE) {
                throw new SeatUnavailableException(
                        "Seat " + eventSeat.getSeat().getSeatNumber() + " is no longer available");
            }

            seatsToLock.add(eventSeat);
            totalAmount = totalAmount.add(eventSeat.getPrice());
        }

        Booking booking = Booking.builder()
                .user(user)
                .event(event)
                .status(BookingStatus.PENDING)
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // This is the concurrency-critical section. AVAILABLE -> LOCKED happens
        // here, seat by seat, with an immediate flush so a version conflict is
        // caught right away instead of waiting for the whole transaction to commit.
        try {
            for (EventSeat eventSeat : seatsToLock) {
                eventSeat.setStatus(SeatStatus.LOCKED);
                eventSeat.setBooking(savedBooking);
                eventSeatRepository.saveAndFlush(eventSeat);
            }
        } catch (ObjectOptimisticLockingFailureException ex) {
            // Someone else's request updated one of these seats between our
            // read and our write - the @Version check caught it. Throwing here
            // rolls back the whole @Transactional method, including the
            // Booking row we just inserted, so nothing is left half-done.
            throw new SeatUnavailableException(
                    "One of the selected seats was just booked by someone else. Please pick again.");
        }

        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(totalAmount)
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        return toResponse(savedBooking, seatsToLock, totalAmount, payment.getStatus());
    }

    @Transactional
    public BookingResponse confirmPayment(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        requireOwnerOrAdmin(booking);

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for booking: " + bookingId));

        // Mock payment gateway - a real integration (Stripe/Razorpay) would
        // confirm via webhook or redirect callback instead of trusting the
        // client directly, but the booking state machine here is the same either way.
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionRef("MOCK-" + UUID.randomUUID());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        List<EventSeat> seats = eventSeatRepository.findByBookingId(bookingId);
        seats.forEach(es -> es.setStatus(SeatStatus.BOOKED));
        eventSeatRepository.saveAll(seats);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        return toResponse(booking, seats, payment.getAmount(), payment.getStatus());
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        requireOwnerOrAdmin(booking);

        List<EventSeat> seats = eventSeatRepository.findByBookingId(bookingId);
        seats.forEach(es -> {
            es.setStatus(SeatStatus.AVAILABLE);
            es.setBooking(null);
        });
        eventSeatRepository.saveAll(seats);

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        paymentRepository.findByBookingId(bookingId).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            }
        });

        Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
        PaymentStatus paymentStatus = payment != null ? payment.getStatus() : null;
        BigDecimal amount = payment != null ? payment.getAmount() : BigDecimal.ZERO;

        return toResponse(booking, seats, amount, paymentStatus);
    }

    public BookingResponse getBooking(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        requireOwnerOrAdmin(booking);

        List<EventSeat> seats = eventSeatRepository.findByBookingId(bookingId);
        Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
        BigDecimal amount = payment != null ? payment.getAmount() : BigDecimal.ZERO;
        PaymentStatus paymentStatus = payment != null ? payment.getStatus() : null;

        return toResponse(booking, seats, amount, paymentStatus);
    }

    public List<BookingResponse> getMyBookings() {
        User user = currentUserProvider.getCurrentUser();
        return bookingRepository.findByUserId(user.getId()).stream()
                .map(b -> getBooking(b.getId()))
                .toList();
    }

    private void requireOwnerOrAdmin(Booking booking) {
        User currentUser = currentUserProvider.getCurrentUser();
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You can only access your own bookings");
        }
    }

    private Booking findOrThrow(UUID id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private BookingResponse toResponse(Booking booking, List<EventSeat> seats, BigDecimal amount, PaymentStatus paymentStatus) {
        List<BookingSeatInfo> seatInfos = seats.stream()
                .map(es -> BookingSeatInfo.builder()
                        .seatNumber(es.getSeat().getSeatNumber())
                        .seatType(es.getSeat().getSeatType())
                        .price(es.getPrice())
                        .build())
                .toList();

        return BookingResponse.builder()
                .id(booking.getId())
                .eventId(booking.getEvent().getId())
                .eventTitle(booking.getEvent().getTitle())
                .status(booking.getStatus())
                .paymentStatus(paymentStatus)
                .totalAmount(amount)
                .bookingTime(booking.getBookingTime())
                .seats(seatInfos)
                .build();
    }
}
