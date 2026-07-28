package com.koino.backend.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "user_login_days",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_login_day",
        columnNames = {"user_id", "login_date"}
    ),
    indexes = @Index(
        name = "idx_user_login_days_user_date",
        columnList = "user_id, login_date"
    )
)
@Getter
@Setter
public class UserLoginDay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loginDayId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "login_date", nullable = false)
    private LocalDate loginDate;
}
