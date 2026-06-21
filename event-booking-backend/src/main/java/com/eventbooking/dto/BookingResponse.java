package com.eventbooking.dto;

import com.eventbooking.entity.BookingStatus;
import com.eventbooking.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private UUID eventId;
    private String eventTitle;
    private BookingStatus status;
    private PaymentStatus paymentStatus;
    private BigDecimal totalAmount;
    private LocalDateTime bookingTime;
    private List<BookingSeatInfo> seats;
}
