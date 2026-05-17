package com.couponvalley.common.reference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "currency")
public class Currency {

    @Id
    @Column(name = "code", length = 3, nullable = false, updatable = false)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "symbol", nullable = false, length = 8)
    private String symbol;

    @Column(name = "fraction_digits", nullable = false)
    private short fractionDigits;

    protected Currency() {}

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getSymbol() { return symbol; }
    public short getFractionDigits() { return fractionDigits; }
}
