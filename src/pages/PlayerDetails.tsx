import { useParams } from "react-router-dom";

const PlayerDetails = () => {
  const { id } = useParams();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Player Details</h1>
      <p>Details for player ID: {id}</p>
    </div>
  );
};

export default PlayerDetails;