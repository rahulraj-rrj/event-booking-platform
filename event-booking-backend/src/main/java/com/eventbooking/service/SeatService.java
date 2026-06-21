package com.eventbooking.service;

import com.eventbooking.dto.SeatRequest;
import com.eventbooking.dto.SeatResponse;
import com.eventbooking.entity.Seat;
import com.eventbooking.entity.Venue;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.repository.SeatRepository;
import com.eventbooking.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;

    public SeatResponse addSeat(UUID venueId, SeatRequest request) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + venueId));

        Seat seat = Seat.builder()
                .venue(venue)
                .seatNumber(request.getSeatNumber())
                .seatType(request.getSeatType())
                .build();

        return toResponse(seatRepository.save(seat));
    }

    public List<SeatResponse> getSeatsByVenue(UUID venueId) {
        return seatRepository.findByVenueId(venueId).stream().map(this::toResponse).toList();
    }

    private SeatResponse toResponse(Seat seat) {
        return SeatResponse.builder()
                .id(seat.getId())
                .venueId(seat.getVenue().getId())
                .seatNumber(seat.getSeatNumber())
                .seatType(seat.getSeatType())
                .build();
    }
}
