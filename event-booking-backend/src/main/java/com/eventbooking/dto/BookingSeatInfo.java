package com.eventbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class BookingSeatInfo {
    private String seatNumber;
    private String seatType;
    private BigDecimal price;
}
