import { useEffect } from "react";
import Swal from "sweetalert2";

// Shows the expiry warning once per browser session.
export default function usePasswordAlert(message, changeUrl) {
  useEffect(() => {
    if (!message || sessionStorage.getItem("pwdAlertShown")) return;
    sessionStorage.setItem("pwdAlertShown", "1");

    Swal.fire({
      icon: "warning",
      title: "Password expiring",
      text: message,
      showCancelButton: !!changeUrl,
      confirmButtonText: changeUrl ? "Change Password" : "Ok",
      cancelButtonText: "Later",
      confirmButtonColor: "#ed3237",
    }).then((r) => {
      if (r.isConfirmed && changeUrl) window.location.href = changeUrl;
    });
  }, [message, changeUrl]);
}