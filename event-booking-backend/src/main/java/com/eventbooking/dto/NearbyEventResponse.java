package com.eventbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NearbyEventResponse {
    private EventResponse event;
    private double distanceKm;
}
