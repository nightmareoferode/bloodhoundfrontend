CREATE TYPE product_type_enum AS ENUM ('Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical');
CREATE TYPE method_of_intake_enum AS ENUM ('Oral', 'Intravenous', 'Sublingual', 'Inhalation');
CREATE TYPE duration_unit_enum AS ENUM ('Days', 'Weeks', 'Months');

CREATE TABLE medications (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    potency               VARCHAR(100) NOT NULL,
    product_type          product_type_enum    NOT NULL,
    method_of_intake      method_of_intake_enum NOT NULL,
    course_duration_value INTEGER      NOT NULL,
    course_duration_unit  duration_unit_enum   NOT NULL,
    frequency             VARCHAR(100) NOT NULL,
    first_dose_time       TIME         NOT NULL,
    user_id               INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usa_name              TEXT,
    rxcui                 TEXT,
    CONSTRAINT ck_medication_duration_positive CHECK (course_duration_value > 0)
);
