# GitHub Copilot Skillset - Tech Product Names Generator

A simple GitHub Copilot Skillset that provides random tech product names using Express.js and Faker.

## Features

- Random tech product name generation
- Customizable number of product names to generate
- Each product includes name, description, price, and other details

## API Endpoints

### Health Check
- **URL**: `/health`
- **Method**: GET
- **Response**: Status of the service

### Generate Random Tech Product Names
- **URL**: `/api/products/tech/random`
- **Method**: GET
- **Query Parameters**:
  - `count` (optional): Number of product names to generate (default: 1, max: 50)
- **Response**: JSON object containing generated product names and details

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

The server will start on port 3000 by default. You can change this by setting the PORT environment variable.

## Example Usage

Generate a single random tech product:
```
GET http://localhost:3000/api/products/tech/random
```

Generate multiple random tech products:
```
GET http://localhost:3000/api/products/tech/random?count=5
```

## License

This project is licensed under the MIT License.