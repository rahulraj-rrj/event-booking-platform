package com.eventbooking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

// This is the most important entity in the whole project.
//
// A Seat is a physical chair. An EventSeat is "seat A12, for THIS event,
// on THIS date" - it is what actually gets booked. Splitting it this way
// means the same physical seat can be AVAILABLE for next week's event and
// BOOKED for tonight's event at the same time, which is how real venues work.
//
// The @Version field is what makes booking safe under concurrency. Every
// time Hibernate updates a row, it checks the version number hasn't changed
// since it was read. If two requests try to book the same EventSeat at the
// same instant, only the first commit succeeds - the second gets an
// OptimisticLockException, which the service layer (phase 5) turns into a
// clean "this seat was just taken, please pick another" response instead of
// silently double-booking the seat.
@Entity
@Table(name = "event_seats", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "seat_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSeat {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    // Null until this seat is reserved as part of a booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatStatus status;

    @Version
    private Long version;
}
