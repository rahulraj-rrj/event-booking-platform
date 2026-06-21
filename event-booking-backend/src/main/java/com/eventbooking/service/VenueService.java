package com.eventbooking.service;

import com.eventbooking.dto.VenueRequest;
import com.eventbooking.dto.VenueResponse;
import com.eventbooking.entity.Venue;
import com.eventbooking.exception.ResourceNotFoundException;
import com.eventbooking.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;

    public VenueResponse createVenue(VenueRequest request) {
        Venue venue = Venue.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .totalSeats(request.getTotalSeats())
                .build();

        return toResponse(venueRepository.save(venue));
    }

    public VenueResponse getVenue(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public List<VenueResponse> getAllVenues() {
        return venueRepository.findAll().stream().map(this::toResponse).toList();
    }

    public VenueResponse updateVenue(UUID id, VenueRequest request) {
        Venue venue = findOrThrow(id);
        venue.setName(request.getName());
        venue.setAddress(request.getAddress());
        venue.setLatitude(request.getLatitude());
        venue.setLongitude(request.getLongitude());
        venue.setTotalSeats(request.getTotalSeats());
        return toResponse(venueRepository.save(venue));
    }

    public void deleteVenue(UUID id) {
        venueRepository.delete(findOrThrow(id));
    }

    private Venue findOrThrow(UUID id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));
    }

    private VenueResponse toResponse(Venue venue) {
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .address(venue.getAddress())
                .latitude(venue.getLatitude())
                .longitude(venue.getLongitude())
                .totalSeats(venue.getTotalSeats())
                .createdAt(venue.getCreatedAt())
                .build();
    }
}
