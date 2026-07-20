package com.saarthi.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "cycle_logs")
public class CycleLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate startDate;

    private String mood;
    private String flow;
    private String symptoms;

    public CycleLog() {}

    public CycleLog(User user, LocalDate startDate, String mood, String flow, String symptoms) {
        this.user = user;
        this.startDate = startDate;
        this.mood = mood;
        this.flow = flow;
        this.symptoms = symptoms;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getFlow() { return flow; }
    public void setFlow(String flow) { this.flow = flow; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
}
