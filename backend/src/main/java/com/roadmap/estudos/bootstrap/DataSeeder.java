package com.roadmap.estudos.bootstrap;

import com.roadmap.estudos.domain.ProgressStatus;
import com.roadmap.estudos.domain.RoadmapNode;
import com.roadmap.estudos.repository.NodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final NodeRepository nodeRepository;

    public DataSeeder(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    @Override
    public void run(String... args) {
        if (nodeRepository.count() > 0) {
            return;
        }

        RoadmapNode backend = save("backend", "Backend", null, 0, 80);
        save("java", "Java", backend, 280, 0);
        save("spring-boot", "Spring Boot", backend, 280, 80);
        save("postgresql", "PostgreSQL", backend, 280, 160);
        save("oracle-database", "Oracle Database", backend, 280, 240);

        RoadmapNode frontend = save("frontend", "Frontend", null, 0, 440);
        save("react", "React", frontend, 280, 360);
        save("tailwind-css", "Tailwind CSS", frontend, 280, 440);
        save("vite", "Vite", frontend, 280, 520);
    }

    private RoadmapNode save(String id, String title, RoadmapNode parent, double x, double y) {
        RoadmapNode node = new RoadmapNode();
        node.setId(id);
        node.setTitle(title);
        node.setParent(parent);
        node.setStatus(ProgressStatus.NOT_STARTED);
        node.setPosX(x);
        node.setPosY(y);
        return nodeRepository.save(node);
    }
}
