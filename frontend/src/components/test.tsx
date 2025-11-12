import { getTestData } from "@/services/test";
import { useEffect, useState } from "react";

export default function Test() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getTestData();
        setData(response);
      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h1>Data from Backend:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
