import GetDevices from "@/components/getDevices";
import GetSniff from "@/components/getSniff";

function DashBoard() {
  return (
    <div>
      <GetDevices />
      <GetSniff />
    </div>
  );
}

export default DashBoard;
