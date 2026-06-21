package com.eventbooking.dto;

import com.eventbooking.entity.SeatStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class EventSeatResponse {
    private UUID id;
    private String seatNumber;
    private String seatType;
    private BigDecimal price;
    private SeatStatus status;
}
