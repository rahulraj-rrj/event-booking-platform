package com.eventbooking.repository;

import com.eventbooking.entity.EventSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventSeatRepository extends JpaRepository<EventSeat, UUID> {

    List<EventSeat> findByEventId(UUID eventId);

    List<EventSeat> findByBookingId(UUID bookingId);
}
