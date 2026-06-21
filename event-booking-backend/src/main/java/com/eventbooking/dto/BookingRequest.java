package com.eventbooking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class BookingRequest {

    @NotNull
    private UUID eventId;

    // ids of EventSeat rows, not Seat rows - these are the per-event bookable units
    @NotEmpty
    private List<UUID> eventSeatIds;
}
