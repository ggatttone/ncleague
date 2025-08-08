import { useParams } from "react-router-dom";

const SeasonArchive = () => {
  const { yyyy, competition, division } = useParams();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Season Archive</h1>
      <p>
        Season: {yyyy}, Competition: {competition}, Division: {division}
      </p>
    </div>
  );
};

export default SeasonArchive;