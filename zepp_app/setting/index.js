
import { UPLOADURL, APIKEY, TODOIST_KEY, DEFAULT_LANG } from '../secrets.js';

AppSettingsPage({
  build(props) {
    if (!props.settingsStorage.getItem("dudu_upload_url")) {
      props.settingsStorage.setItem("dudu_upload_url", UPLOADURL);
    }
    const uploadUrl = props.settingsStorage.getItem("dudu_upload_url");
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
          label: "Upload URL",
          value: uploadUrl,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_upload_url", val);
          },
        }),
      ]
    );

    // --- API Key section ---
    if (!props.settingsStorage.getItem("dudu_api_key")) {
      props.settingsStorage.setItem("dudu_api_key", APIKEY);
    }
    const apiKey = props.settingsStorage.getItem("dudu_api_key");

    const keyConfig = Section(
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
          "API Key"
        ),
        TextInput({
          label: "API Key",
          value: apiKey,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_api_key", val);
          },
        }),
      ]
    );

    // --- Todoist API Key section ---
    if (!props.settingsStorage.getItem("dudu_todoist_key")) {
      props.settingsStorage.setItem("dudu_todoist_key", TODOIST_KEY);
    }
    const todoistKey = props.settingsStorage.getItem("dudu_todoist_key");

    const todoistKeyConfig = Section(
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
          "Todoist API Key"
        ),
        TextInput({
          label: "Todoist API Key",
          value: todoistKey,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_todoist_key", val);
          },
        }),
      ]
    );

    // --- Language section ---
    if (!props.settingsStorage.getItem("dudu_language")) {
      props.settingsStorage.setItem("dudu_language", DEFAULT_LANG);
    }
    const currentLanguage = props.settingsStorage.getItem("dudu_language");

    const languageConfig = Section(
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
          "Transcription Language"
        ),
        Select({
          label: "Language",
          options: [
            { name: "Italian", value: "it" },
            { name: "English", value: "en" },
          ],
          defaultValue: currentLanguage,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_language", val);
          },
        }),
      ]
    );

    // --- Duration slider section ---
    const currentDuration = parseInt(props.settingsStorage.getItem("dudu_duration")) || 30;

    const durationConfig = Section(
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
          "Recording Duration: " + currentDuration + "s"
        ),
        Slider({
          label: currentDuration + "s",
          min: 5,
          max: 60,
          step: 5,
          value: currentDuration,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_duration", String(val));
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
          keyConfig,
          todoistKeyConfig,
          languageConfig,
          durationConfig,
          Text(
            {
              paragraph: true,
              style: { marginTop: "20px", color: "#999999" },
            },
            "No recordings uploaded yet. Open DuDu on your watch and tap Sync."
          ),
        ]
      );
    }

    const fileItems = files.map(function (file, index) {
      const date = new Date(file.uploadedAt || file.receivedAt);
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
                    "Uploaded: " + dateStr
                  ),
                ]
              ),
              Button({
                label: "Delete",
                style: {
                  fontSize: "12px",
                  borderRadius: "20px",
                  background: "#e53935",
                  color: "white",
                  padding: "6px 14px",
                  marginLeft: "8px",
                },
                onClick: () => {
                  const updated = files.filter((f) => f.fileName !== file.fileName);
                  props.settingsStorage.setItem("dudu_files", JSON.stringify(updated));
                  props.settingsStorage.setItem("dudu_data_" + file.fileName, "");
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
        keyConfig,
        todoistKeyConfig,
        languageConfig,
        durationConfig,
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
