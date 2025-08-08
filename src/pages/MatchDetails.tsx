import { useParams } from "react-router-dom";

const MatchDetails = () => {
  const { id } = useParams();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Match Details</h1>
      <p>Details for match ID: {id}</p>
    </div>
  );
};

export default MatchDetails;