package com.eventbooking.service;

import com.eventbooking.dto.EventRequest;
import com.eventbooking.dto.EventResponse;
import com.eventbooking.dto.EventSeatResponse;
import com.eventbooking.dto.NearbyEventResponse;
import com.eventbooking.dto.PageResponse;
import com.eventbooking.entity.Event;
import com.eventbooking.entity.EventSeat;
import com.eventbooking.entity.Role;
import com.eventbooking.entity.Seat;
import com.eventbooking.entity.SeatStatus;
import com.eventbooking.entity.User;
import com.eventbooking.entity.Venue;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.repository.EventRepository;
import com.eventbooking.repository.EventSeatRepository;
import com.eventbooking.repository.SeatRepository;
import com.eventbooking.repository.VenueRepository;
import com.eventbooking.security.CurrentUserProvider;
import com.eventbooking.specification.EventSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final SeatRepository seatRepository;
    private final EventSeatRepository eventSeatRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));

        // The organizer is whoever is making this authenticated request -
        // never trust an id passed in from the client for something like this.
        User organizer = currentUserProvider.getCurrentUser();

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .venue(venue)
                .organizer(organizer)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Event savedEvent = eventRepository.save(event);

        // The actual bookable units: one EventSeat per physical seat in the
        // venue, all starting AVAILABLE at the event's base price.
        List<Seat> venueSeats = seatRepository.findByVenueId(venue.getId());
        List<EventSeat> eventSeats = venueSeats.stream()
                .map(seat -> EventSeat.builder()
                        .event(savedEvent)
                        .seat(seat)
                        .price(request.getBasePrice())
                        .status(SeatStatus.AVAILABLE)
                        .build())
                .toList();
        eventSeatRepository.saveAll(eventSeats);

        return toResponse(savedEvent);
    }

    public EventResponse getEvent(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public PageResponse<EventResponse> searchEvents(
            String category, String keyword, LocalDateTime from, LocalDateTime to, Pageable pageable) {

        Specification<Event> spec = Specification.where(EventSpecifications.hasCategory(category))
                .and(EventSpecifications.titleContains(keyword))
                .and(EventSpecifications.startsAfter(from))
                .and(EventSpecifications.startsBefore(to));

        Page<Event> page = eventRepository.findAll(spec, pageable);

        return PageResponse.<EventResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    // Plain Java distance filtering rather than a native SQL query - simpler
    // to read and plenty fast at this project's scale. The Haversine formula
    // accounts for the Earth's curvature when computing distance between two
    // lat/lng points.
    public List<NearbyEventResponse> findNearbyEvents(double lat, double lng, double radiusKm) {
        return eventRepository.findAll().stream()
                .filter(e -> e.getVenue().getLatitude() != null && e.getVenue().getLongitude() != null)
                .map(e -> NearbyEventResponse.builder()
                        .event(toResponse(e))
                        .distanceKm(haversineKm(lat, lng, e.getVenue().getLatitude(), e.getVenue().getLongitude()))
                        .build())
                .filter(result -> result.getDistanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(NearbyEventResponse::getDistanceKm))
                .toList();
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    public EventResponse updateEvent(UUID id, EventRequest request) {
        Event event = findOrThrow(id);
        requireOwnerOrAdmin(event);

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        return toResponse(eventRepository.save(event));
    }

    public void deleteEvent(UUID id) {
        Event event = findOrThrow(id);
        requireOwnerOrAdmin(event);
        eventRepository.delete(event);
    }

    public List<EventSeatResponse> getSeatsForEvent(UUID eventId) {
        findOrThrow(eventId);
        return eventSeatRepository.findByEventId(eventId).stream()
                .map(es -> EventSeatResponse.builder()
                        .id(es.getId())
                        .seatNumber(es.getSeat().getSeatNumber())
                        .seatType(es.getSeat().getSeatType())
                        .price(es.getPrice())
                        .status(es.getStatus())
                        .build())
                .toList();
    }

    // ORGANIZERs can only modify events they created. ADMIN bypasses this
    // check entirely. The @PreAuthorize on the controller already confirmed
    // the caller is an ORGANIZER or ADMIN - this confirms WHICH one, and
    // that it's the right one.
    private void requireOwnerOrAdmin(Event event) {
        User currentUser = currentUserProvider.getCurrentUser();
        boolean isOwner = event.getOrganizer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You can only modify events you organize");
        }
    }

    private Event findOrThrow(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .venueId(event.getVenue().getId())
                .venueName(event.getVenue().getName())
                .organizerId(event.getOrganizer().getId())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .createdAt(event.getCreatedAt())
                .build();
    }
}

