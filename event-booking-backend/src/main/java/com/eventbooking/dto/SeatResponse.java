package com.eventbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class SeatResponse {
    private UUID id;
    private UUID venueId;
    private String seatNumber;
    private String seatType;
}
