FROM golang:1.24-alpine

WORKDIR /leaderboard_service

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# RUN go run github.com/99designs/gqlgen generate
# RUN CGO_ENABLED=0 GOOS=linux go run github.com/99designs/gqlgen generate
# RUN CGO_ENABLED=0 GOOS=linux go run github.com/99designs/gqlgen generate
# RUN CGO_ENABLED=0 GOOS=linux go build -o /leaderboard_server
# RUN CGO_ENABLED=0 GOOS=linux ./server
# RUN go run server.go
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Expose the port the app runs on
EXPOSE 8080

CMD ["./main"]
