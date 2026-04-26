package com.triaje.backend.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;

public class AuthenticatedUserPrincipal {

    private final Integer userId;
    private final String username;
    private final String roleName;
    private final Collection<? extends GrantedAuthority> authorities;

    public AuthenticatedUserPrincipal(
            Integer userId,
            String username,
            String roleName,
            Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.username = username;
        this.roleName = roleName;
        this.authorities = authorities;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getRoleName() {
        return roleName;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
}
