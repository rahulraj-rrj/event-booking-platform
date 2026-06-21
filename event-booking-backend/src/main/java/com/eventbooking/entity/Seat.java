package com.eventbooking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

// A Seat is the physical chair in the venue (e.g. "A12"). It does NOT carry
// booking status, because the same physical seat is reused across many
// different events. Per-event availability lives on EventSeat instead.
@Entity
@Table(name = "seats", uniqueConstraints = @UniqueConstraint(columnNames = {"venue_id", "seat_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(name = "seat_number", nullable = false, length = 10)
    private String seatNumber;

    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;
}
