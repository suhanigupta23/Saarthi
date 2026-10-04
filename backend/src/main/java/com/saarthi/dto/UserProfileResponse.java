package com.saarthi.dto;

import com.saarthi.model.User;

public record UserProfileResponse(
        String username,
        String name,
        String age,
        String location,
        String pregnancyStatus
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getUsername(),
                user.getName(),
                user.getAge(),
                user.getLocation(),
                user.getPregnancyStatus()
        );
    }
}
