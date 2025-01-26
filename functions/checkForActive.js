const Network = require("../models/Network.model");
const UserSchema = require("../models/User.model");

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Main function
const checkForActive = async () => {
  console.log("Checking for active users...");
  try {
    // Fetch all networks
    const networks = await Network.find();
    console.log("Networks fetched:", networks.length);

    // Collect all user IDs from all networks
    const allUserIds = networks.flatMap((network) =>
      network.Accepted.map((user) => user.userId)
    );

    // Fetch all users in a single query
    const users = await UserSchema.find({ _id: { $in: allUserIds } });
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    // Iterate through each network
    for (const network of networks) {
      const networkCoordinates = network.coordinates.coordinates;
      const updates = [];

      for (const acceptedUser of network.Accepted) {
        const user = userMap.get(acceptedUser.userId.toString());

        if (!user) {
          console.error(`User with ID ${acceptedUser.userId} not found.`);
          updates.push({
            updateOne: {
              filter: { _id: network._id },
              update: { $pull: { Accepted: { userId: acceptedUser.userId } } },
            },
          });
          continue;
        }

        const userLat = user.latitude;
        const userLong = user.longitude;
        const lastActive = user.updatedAt;

        // Check if user is active (updated within the last minute)
        let isActive = lastActive >= new Date(Date.now() - 1000 * 60);

        // Check if user is within the network's radius
        const distance = calculateDistance(
          userLat,
          userLong,
          networkCoordinates[1],
          networkCoordinates[0]
        );
        if (distance > network.radius) {
          isActive = false;
        }

        // Prepare update for this user
        updates.push({
          updateOne: {
            filter: {
              _id: network._id,
              "Accepted.userId": acceptedUser.userId,
            },
            update: { $set: { "Accepted.$.Active": isActive } },
          },
        });
      }

      // Perform bulk update for the network
      if (updates.length > 0) {
        try {
          await Network.bulkWrite(updates);
          console.log(
            `Updated ${updates.length} users in network ${network.name}.`
          );
        } catch (error) {
          console.error(
            `Error updating users in network ${network.name}:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in checkForActive function:", error);
  }
};

// Export the function
module.exports = checkForActive;
