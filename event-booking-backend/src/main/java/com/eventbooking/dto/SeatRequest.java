package com.eventbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SeatRequest {

    @NotBlank
    @Size(max = 10)
    private String seatNumber;

    @NotBlank
    @Size(max = 20)
    private String seatType;
}
