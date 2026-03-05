"""
Clario Synthetic Data Simulator — Student Archetypes
Defines behavioral profiles for simulated students.
"""

# ─── JEE Subject Taxonomy ─────────────────────────────────────────────────────

JEE_TAXONOMY = {
    "Physics": {
        "Mechanics": {
            "subtopics": ["Kinematics", "Newton's Laws", "Work Energy Power", "Rotational Mechanics", "Gravitation"],
            "concept_tags": ["velocity", "acceleration", "force", "torque", "moment_of_inertia", "angular_momentum", "friction", "projectile_motion"],
        },
        "Thermodynamics": {
            "subtopics": ["Laws of Thermodynamics", "Heat Transfer", "Kinetic Theory"],
            "concept_tags": ["entropy", "enthalpy", "carnot_cycle", "specific_heat", "conduction"],
        },
        "Electromagnetism": {
            "subtopics": ["Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction"],
            "concept_tags": ["coulombs_law", "electric_field", "capacitance", "resistance", "magnetic_field", "faraday_law"],
        },
        "Optics": {
            "subtopics": ["Ray Optics", "Wave Optics"],
            "concept_tags": ["refraction", "reflection", "diffraction", "interference", "lens_formula"],
        },
        "Modern Physics": {
            "subtopics": ["Photoelectric Effect", "Nuclear Physics", "Atomic Structure"],
            "concept_tags": ["photon_energy", "radioactive_decay", "bohr_model", "wave_particle_duality"],
        },
    },
    "Mathematics": {
        "Calculus": {
            "subtopics": ["Limits", "Differentiation", "Integration", "Differential Equations"],
            "concept_tags": ["limits", "derivatives", "definite_integral", "indefinite_integral", "ode"],
        },
        "Algebra": {
            "subtopics": ["Quadratic Equations", "Complex Numbers", "Matrices", "Permutations and Combinations"],
            "concept_tags": ["quadratic_formula", "complex_plane", "determinant", "matrix_inverse", "binomial_theorem"],
        },
        "Coordinate Geometry": {
            "subtopics": ["Straight Lines", "Circles", "Conics"],
            "concept_tags": ["slope", "distance_formula", "parabola", "ellipse", "hyperbola"],
        },
        "Trigonometry": {
            "subtopics": ["Trigonometric Functions", "Inverse Trigonometry", "Trigonometric Equations"],
            "concept_tags": ["sin_cos_tan", "inverse_trig", "trig_identities", "trig_equations"],
        },
    },
    "Chemistry": {
        "Organic Chemistry": {
            "subtopics": ["Hydrocarbons", "Alcohols and Ethers", "Carbonyl Compounds", "Reaction Mechanisms"],
            "concept_tags": ["alkanes", "alkenes", "alcohol_reactions", "aldehyde", "sn1_sn2", "elimination"],
        },
        "Inorganic Chemistry": {
            "subtopics": ["Periodic Table", "Chemical Bonding", "Coordination Compounds"],
            "concept_tags": ["periodic_trends", "ionic_bond", "covalent_bond", "crystal_field_theory"],
        },
        "Physical Chemistry": {
            "subtopics": ["Chemical Kinetics", "Chemical Equilibrium", "Electrochemistry", "Solutions"],
            "concept_tags": ["rate_law", "equilibrium_constant", "nernst_equation", "colligative_properties"],
        },
    },
}


# ─── Student Archetypes ───────────────────────────────────────────────────────

ARCHETYPES = {
    "strong": {
        "name": "Strong Student",
        "description": "High accuracy, fast responses, wins most duels",
        "base_accuracy": 0.85,
        "accuracy_variance": 0.08,
        "base_time_ms": 6000,
        "time_variance_ms": 2000,
        "weak_topics": [],       # Strong across the board
        "strong_topics_bonus": 0.10,  # Extra accuracy on strong topics
        "duel_win_probability": 0.75,
        "count": 5,              # Number of students to simulate
    },
    "average": {
        "name": "Average Student",
        "description": "Moderate accuracy, moderate speed, mixed duel results",
        "base_accuracy": 0.60,
        "accuracy_variance": 0.12,
        "base_time_ms": 11000,
        "time_variance_ms": 4000,
        "weak_topics": ["Integration", "Rotational Mechanics", "Organic Chemistry"],
        "strong_topics_bonus": 0.05,
        "duel_win_probability": 0.50,
        "count": 10,
    },
    "weak": {
        "name": "Weak Student",
        "description": "Low accuracy, slow responses, frequent mistakes",
        "base_accuracy": 0.35,
        "accuracy_variance": 0.10,
        "base_time_ms": 16000,
        "time_variance_ms": 5000,
        "weak_topics": ["Calculus", "Electromagnetism", "Organic Chemistry", "Rotational Mechanics"],
        "strong_topics_bonus": 0.03,
        "duel_win_probability": 0.25,
        "count": 5,
    },
    "guessing": {
        "name": "Guessing Student",
        "description": "Very fast responses, low accuracy — rushing through",
        "base_accuracy": 0.28,
        "accuracy_variance": 0.05,
        "base_time_ms": 3000,
        "time_variance_ms": 1500,
        "weak_topics": ["Integration", "Thermodynamics", "Reaction Mechanisms"],
        "strong_topics_bonus": 0.02,
        "duel_win_probability": 0.20,
        "count": 3,
    },
    "improving": {
        "name": "Improving Student",
        "description": "Starts weak, gradually gets better over time",
        "base_accuracy": 0.40,
        "accuracy_variance": 0.10,
        "base_time_ms": 13000,
        "time_variance_ms": 3000,
        "weak_topics": ["Calculus", "Thermodynamics"],
        "strong_topics_bonus": 0.04,
        "duel_win_probability": 0.40,
        "improvement_rate": 0.005,  # Accuracy improves by 0.5% per session
        "count": 5,
    },
}
