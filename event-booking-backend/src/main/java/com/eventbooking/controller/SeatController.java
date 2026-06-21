package com.eventbooking.controller;

import com.eventbooking.dto.SeatRequest;
import com.eventbooking.dto.SeatResponse;
import com.eventbooking.service.SeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/venues/{venueId}/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SeatResponse> addSeat(@PathVariable UUID venueId, @Valid @RequestBody SeatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seatService.addSeat(venueId, request));
    }

    @GetMapping
    public ResponseEntity<List<SeatResponse>> getSeats(@PathVariable UUID venueId) {
        return ResponseEntity.ok(seatService.getSeatsByVenue(venueId));
    }
}
