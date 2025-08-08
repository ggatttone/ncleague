import { useParams } from "react-router-dom";

const NewsDetails = () => {
  const { slug } = useParams();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">News Article</h1>
      <p>Article slug: {slug}</p>
    </div>
  );
};

export default NewsDetails;