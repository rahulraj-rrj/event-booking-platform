package com.eventbooking.specification;

import com.eventbooking.entity.Event;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class EventSpecifications {

    public static Specification<Event> hasCategory(String category) {
        return (root, query, cb) -> category == null
                ? null
                : cb.equal(cb.lower(root.get("category")), category.toLowerCase());
    }

    public static Specification<Event> titleContains(String keyword) {
        return (root, query, cb) -> keyword == null
                ? null
                : cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<Event> startsAfter(LocalDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("startTime"), from);
    }

    public static Specification<Event> startsBefore(LocalDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("startTime"), to);
    }
}
