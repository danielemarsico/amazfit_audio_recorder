
import { UPLOADURL, APIKEY, TODOIST_KEY } from '../secrets.js';

// Keep in sync with zepp_app/config.js
const SIMULATOR_MODE = true;

const FAKE_FILES = [
  { fileName: "record_20260314_091500.opus", uploadedAt: "2026-03-14T09:15:00Z" },
  { fileName: "record_20260314_103022.opus", uploadedAt: "2026-03-14T10:30:22Z" },
  { fileName: "record_20260313_184501.opus", uploadedAt: "2026-03-13T18:45:01Z" },
];

AppSettingsPage({
  build(props) {
    if (!props.settingsStorage.getItem("dudu_upload_url")) {
      props.settingsStorage.setItem("dudu_upload_url", UPLOADURL);
    }
    const uploadUrl = props.settingsStorage.getItem("dudu_upload_url");
    let files = [];
    if (SIMULATOR_MODE) {
      files = FAKE_FILES;
    } else {
      const stored = props.settingsStorage.getItem("dudu_files");
      try {
        files = stored ? JSON.parse(stored) : [];
      } catch (e) {
        files = [];
      }
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
            style: { color: "#ffffff", fontSize: "13px", marginBottom: "8px" },
          },
          "Upload URL (HTTP POST)"
        ),
        TextInput({
          label: "",
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
            style: { color: "#ffffff", fontSize: "13px", marginBottom: "8px" },
          },
          "API Key"
        ),
        TextInput({
          label: "",
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
            style: { color: "#ffffff", fontSize: "13px", marginBottom: "8px" },
          },
          "Todoist API Key"
        ),
        TextInput({
          label: "",
          value: todoistKey,
          onChange: (val) => {
            props.settingsStorage.setItem("dudu_todoist_key", val);
          },
        }),
      ]
    );

    // --- Language section ---
    if (!props.settingsStorage.getItem("dudu_language")) {
      props.settingsStorage.setItem("dudu_language", "en");
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
            style: { color: "#ffffff", fontSize: "13px", marginBottom: "8px" },
          },
          "Transcription Language"
        ),
        Select({
          label: "",
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
            style: { color: "#ffffff", fontSize: "13px", marginBottom: "8px" },
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
            backgroundColor: "#0a1628",
            minHeight: "100%",
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

    const fileItems = files.map(function (file) {
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
          backgroundColor: "#0a1628",
          minHeight: "100%",
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
