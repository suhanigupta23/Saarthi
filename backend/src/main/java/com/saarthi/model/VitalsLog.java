package com.saarthi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vitals_logs")
public class VitalsLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    private Integer systolic;
    private Integer diastolic;
    private Integer bloodSugar;
    private Double weight;
    private Double height;
    private Double bmi;
    private String category;
    private String monthLabel;

    public VitalsLog() {}

    public VitalsLog(User user, LocalDateTime recordedAt, Integer systolic, Integer diastolic, Integer bloodSugar, Double weight, Double height, Double bmi, String category, String monthLabel) {
        this.user = user;
        this.recordedAt = recordedAt;
        this.systolic = systolic;
        this.diastolic = diastolic;
        this.bloodSugar = bloodSugar;
        this.weight = weight;
        this.height = height;
        this.bmi = bmi;
        this.category = category;
        this.monthLabel = monthLabel;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }

    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer systolic) { this.systolic = systolic; }

    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }

    public Integer getBloodSugar() { return bloodSugar; }
    public void setBloodSugar(Integer bloodSugar) { this.bloodSugar = bloodSugar; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMonthLabel() { return monthLabel; }
    public void setMonthLabel(String monthLabel) { this.monthLabel = monthLabel; }
}
