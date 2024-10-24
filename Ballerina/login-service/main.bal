import ballerina/http;
import ballerinax/mongodb as mongo;
import ballerina/log;
import ballerina/jwt;

listener http:Listener backendListener = new(8080);

// MongoDB client configuration
mongo:Client mongoClient = check new (connection = "mongodb+srv://Username:Password@cluster0.dezgn.mongodb.net/shopper");

// Define the MongoDB database and collections
mongo:Database db = check mongoClient->getDatabase("shopper");
mongo:Collection userCollection = check db->getCollection("users");

// Secret key for JWT
string secretKey = "secret_ecom";

// Endpoint to register user
service /signup on backendListener {

    resource function post signup(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload(); // Ensure valid JSON payload

        string email = payload.email.toString();
        string name = payload.name.toString();
        string password = payload.password.toString();

        // Check if user already exists
        json existingUser = check userCollection->findOne({ "email": email });

        // Check if existingUser is empty
        if (existingUser != ()) {
            check caller->respond({ success: false, errors: "Existing user found" });
            return;
        }

        // Initialize cart data
        map<int> cartData = {};
        foreach int i in 0...299 {
            cartData[i.toString()] = 0;
        }

        // Create new user document and insert it into MongoDB
        json newUser = { "name": name, "email": email, "password": password, "cartData": cartData };
        error? insertError = userCollection->insert(newUser); // Make sure 'insert' is correct
        if (insertError is error) {
            check caller->respond({ success: false, errors: "Failed to insert user" });
            return;
        }

        // Create JWT token
        string signedJWT = createJwtToken(email);

        // Respond with success
        check caller->respond({ success: true, token: signedJWT, user: name });
    }
}

// Endpoint to login user
service /login on backendListener {

    resource function post login(http:Caller caller, http:Request req) returns error? {
        json payload = check req.getJsonPayload(); // Ensure valid JSON payload

        string email = payload.email.toString();
        string password = payload.password.toString();

        // Check if user exists in the database
        json user = check userCollection->findOne({ "email": email });

        // Check if user exists
        if (user is ()) {
            check caller->respond({ success: false, errors: "Wrong Email" });
            return;
        }

        // Compare passwords
        string dbPassword = user.password.toString();
        if (dbPassword != password) {
            check caller->respond({ success: false, errors: "Wrong password" });
            return;
        }

        // Create JWT token
        string signedJWT = createJwtToken(email);

        // Respond with success
        check caller->respond({ success: true, token: signedJWT, user: user.name.toString() });
    }
}

// Function to create JWT token
function createJwtToken(string email) returns string {
    jwt:Header header = {};
    jwt:Payload payload = { sub: email };

    // Sign JWT with the secret key
    string signedJwt = checkpanic jwt:encodeJwt(header, payload, secretKey); // Ensure this method is correct
    return signedJwt;
}
