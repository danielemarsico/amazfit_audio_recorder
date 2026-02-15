AppSettingsPage({
  build(props) {
    const stored = props.settingsStorage.getItem("dudu_files");
    let files = [];
    try {
      files = stored ? JSON.parse(stored) : [];
    } catch (e) {
      files = [];
    }

    if (files.length === 0) {
      return View(
        {
          style: {
            padding: "20px",
            textAlign: "center",
          },
        },
        [
          Text(
            {
              bold: true,
              paragraph: true,
              style: { fontSize: "20px", color: "#ffffff" },
            },
            "DuDu Recordings"
          ),
          Text(
            {
              paragraph: true,
              style: { marginTop: "20px", color: "#999999" },
            },
            "No recordings transferred yet. Open DuDu on your watch to record and transfer."
          ),
        ]
      );
    }

    const fileItems = files.map(function (file, index) {
      const date = new Date(file.receivedAt);
      const dateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0") +
        " " +
        String(date.getHours()).padStart(2, "0") +
        ":" +
        String(date.getMinutes()).padStart(2, "0");

      return View(
        {
          style: {
            borderBottom: "1px solid #333333",
            padding: "12px 0",
          },
        },
        [
          Text(
            {
              bold: true,
              paragraph: true,
              style: { color: "#ffffff", fontSize: "14px" },
            },
            file.fileName
          ),
          Text(
            {
              paragraph: true,
              style: { color: "#888888", fontSize: "12px", marginTop: "4px" },
            },
            "Received: " + dateStr
          ),
        ]
      );
    });

    return View(
      {
        style: {
          padding: "20px",
        },
      },
      [
        Text(
          {
            bold: true,
            paragraph: true,
            style: {
              fontSize: "20px",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "16px",
            },
          },
          "DuDu Recordings"
        ),
        Text(
          {
            paragraph: true,
            style: {
              color: "#999999",
              textAlign: "center",
              marginBottom: "16px",
            },
          },
          files.length + " recording" + (files.length !== 1 ? "s" : "")
        ),
      ].concat(fileItems)
    );
  },
});
