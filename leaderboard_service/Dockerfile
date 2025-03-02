# Use the official Go image as a base
FROM golang:1.22.12

# Set the Current Working Directory inside the container
WORKDIR /leaderboard_service

# Copy the go.mod and go.sum files
COPY go.mod ./

# Download Go modules
RUN go mod download

# Copy the source code into the container
COPY . .

# Compile the Go server
RUN go build -o server .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./server"]
