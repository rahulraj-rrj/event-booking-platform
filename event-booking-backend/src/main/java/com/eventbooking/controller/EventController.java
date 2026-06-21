package com.eventbooking.controller;

import com.eventbooking.dto.EventRequest;
import com.eventbooking.dto.EventResponse;
import com.eventbooking.dto.EventSeatResponse;
import com.eventbooking.dto.NearbyEventResponse;
import com.eventbooking.dto.PageResponse;
import com.eventbooking.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // Role check happens here. Ownership (which organizer) is checked
    // inside EventService, since that needs to compare against this
    // specific event's organizer, not just "any ORGANIZER".
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    // All filters are optional - GET /api/events with no params just paginates everything
    @GetMapping
    public ResponseEntity<PageResponse<EventResponse>> search(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 10, sort = "startTime") Pageable pageable) {
        return ResponseEntity.ok(eventService.searchEvents(category, keyword, from, to, pageable));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyEventResponse>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25") double radiusKm) {
        return ResponseEntity.ok(eventService.findNearbyEvents(lat, lng, radiusKm));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getOne(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEvent(id));
    }

    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> update(@PathVariable UUID id, @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<EventSeatResponse>> getSeats(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getSeatsForEvent(id));
    }
}
