# Badminton Lesson Scheduling and Management Application API

Severless API using AWS Gateway and AWS Lambda. Routed all requests into a single Lambda function.
API has three layers:

- **Service**: handles SQL queries (SELECT, INSERT, UPDATE, DELETE)
- **Controller**: manipulates data coming from Service layer
- **Routes**: directs the incoming HTTP requests to the correct controller
