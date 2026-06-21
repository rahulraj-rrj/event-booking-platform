package com.eventbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class VenueResponse {
    private UUID id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer totalSeats;
    private LocalDateTime createdAt;
}
