AppSettingsPage({
  build(props) {
    const uploadUrl = props.settingsStorage.getItem("dudu_upload_url") || "";
    const stored = props.settingsStorage.getItem("dudu_files");
    let files = [];
    try {
      files = stored ? JSON.parse(stored) : [];
    } catch (e) {
      files = [];
    }

    const urlConfig = Section(
      {
        style: {
          marginBottom: "16px",
          borderBottom: "1px solid #333333",
          paddingBottom: "16px",
        },
      },
      [
        Text(
          {
            bold: true,
            paragraph: true,
            style: { color: "#cccccc", fontSize: "13px", marginBottom: "8px" },
          },
          "Upload URL (HTTP POST)"
        ),
        TextInput({
          label: "https://example.com/upload",
          value: uploadUrl,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_upload_url", val);
          },
          subStyle: {
            fontSize: "14px",
            color: "#ffffff",
            background: "#222222",
            border: "1px solid #444444",
            borderRadius: "8px",
            padding: "8px 12px",
          },
        }),
      ]
    );

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
          urlConfig,
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
          View(
            {
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              },
            },
            [
              View(
                { style: { flex: 1 } },
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
              ),
              props.settingsStorage.getItem("dudu_uploaded_" + file.fileName)
                ? Text(
                    {
                      style: {
                        fontSize: "12px",
                        color: "#4caf50",
                        marginLeft: "8px",
                      },
                    },
                    "Uploaded"
                  )
                : Button({
                    label: "Upload",
                    style: {
                      fontSize: "12px",
                      borderRadius: "20px",
                      background: "#4caf50",
                      color: "white",
                      padding: "6px 14px",
                      marginLeft: "8px",
                    },
                    click_func: () => {
                      props.settingsStorage.setItem(
                        "dudu_uploaded_" + file.fileName,
                        "uploaded"
                      );
                    },
                  }),
            ]
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
        urlConfig,
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
