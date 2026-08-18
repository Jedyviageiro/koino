package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.User;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    boolean existsByEmailAndUserIdNot(String email, Long userId);

    User findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByFriendCodeIgnoreCase(String friendCode);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCaseAndUserIdNot(String username, Long userId);

    boolean existsByFriendCodeIgnoreCase(String friendCode);
    
}

