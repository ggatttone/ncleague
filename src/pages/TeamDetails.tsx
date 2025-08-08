import { useParams } from "react-router-dom";

const TeamDetails = () => {
  const { id } = useParams();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Club Details</h1>
      <p>Details for club ID: {id}</p>
    </div>
  );
};

export default TeamDetails;