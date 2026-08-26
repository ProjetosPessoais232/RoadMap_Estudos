package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.ChatConversation;
import com.roadmap.estudos.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {
    List<ChatConversation> findByOwnerOrderByUpdatedAtDesc(UserAccount owner);
    Optional<ChatConversation> findByIdAndOwner(UUID id, UserAccount owner);
    @Query("select distinct c from ChatConversation c left join c.messages m where c.owner = :owner and " +
            "(lower(c.title) like lower(concat('%', :query, '%')) or lower(m.content) like lower(concat('%', :query, '%'))) order by c.updatedAt desc")
    List<ChatConversation> search(@Param("owner") UserAccount owner, @Param("query") String query);
}
