package com.hotelbonaventura.administracion.repository;

import com.hotelbonaventura.administracion.entity.ParametroGlobal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParametroRepository extends JpaRepository<ParametroGlobal, String> {
}
