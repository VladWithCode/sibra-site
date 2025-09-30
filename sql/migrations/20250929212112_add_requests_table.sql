-- +goose Up
-- +goose StatementBegin
CREATE TABLE requests (
    id UUID PRIMARY KEY,
    type VARCHAR(16) NOT NULL, -- informacion, cita
    phone VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scheduled_date TIMESTAMP, -- date when the request is scheduled to be done
    status VARCHAR(16) NOT NULL, -- pendiente, atendida, confirmada, volver a atender
    agent UUID REFERENCES users(id),
    property UUID REFERENCES properties(id),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_agent ON requests(agent);
CREATE INDEX idx_requests_property ON requests(property);
CREATE INDEX idx_requests_scheduled_date ON requests(scheduled_date);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE requests;
-- +goose StatementEnd
