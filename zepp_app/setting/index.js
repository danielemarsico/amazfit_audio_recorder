
import { UPLOADURL, APIKEY, TODOIST_CLIENT_ID, TODOIST_CLIENT_SECRET, DEFAULT_LANG } from '../secrets.js';

const _UPLOADURL        = UPLOADURL        || '';
const _APIKEY           = APIKEY           || '';
const _CLIENT_ID        = TODOIST_CLIENT_ID     || '';
const _CLIENT_SECRET    = TODOIST_CLIENT_SECRET || '';
const _DEFAULT_LANG     = DEFAULT_LANG     || 'en';

// Keep in sync with zepp_app/config.js
const SIMULATOR_MODE = false;

const FAKE_FILES = [
  { fileName: "record_20260314_091500.opus", uploadedAt: "2026-03-14T09:15:00Z" },
  { fileName: "record_20260314_103022.opus", uploadedAt: "2026-03-14T10:30:22Z" },
  { fileName: "record_20260313_184501.opus", uploadedAt: "2026-03-13T18:45:01Z" },
];

AppSettingsPage({
  build(props) {
    if (!props.settingsStorage.getItem("dudu_upload_url")) {
      props.settingsStorage.setItem("dudu_upload_url", _UPLOADURL);
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
          backgroundColor: "#1a4a8a",
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
      props.settingsStorage.setItem("dudu_api_key", _APIKEY);
    }
    const apiKey = props.settingsStorage.getItem("dudu_api_key");

    const keyConfig = Section(
      {
        style: {
          marginBottom: "16px",
          borderBottom: "1px solid #333333",
          paddingBottom: "16px",
          backgroundColor: "#1a4a8a",
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

    // --- Todoist OAuth section ---
    const todoistKeyConfig = Section(
      {
        style: {
          marginBottom: "16px",
          borderBottom: "1px solid #333333",
          paddingBottom: "16px",
          backgroundColor: "#1a4a8a",
        },
      },
      [
        View(
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "8px",
            },
          },
          [
            Image({
              src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAF2RJREFUeF6lm3mcHVWZ97+nqu5+b29Jp9OhSQIhmsQEEAZfQFFQySCIIlvC8hrZJjiofF70nc+4MM5nZtTX0RHREURE9iAGNCAEQSDDKhKWhBDIAEl3QnfS6XSnO919+/bd6swf55yqU9W3I37eJ1TX2c/z/J7fWW8heA9S++G/LhNjB07Erx8r6rX5+H470s+TTLdJz2sTkyWo10BKhPR1LRF5TZVGGTKeYCVJFXYcpBDgesh0BuHLESYnBhFiHMfZJ12vB8d9WTa1PO999Vtboo1NlUZaBFL90XfPdgZ2X021cqLw6x4yrqAEKUE4IIRuzbxt+UtgxMQ2ekq6BkJKkL7uL96wQLpunUTyWZnN/8D7p//3cKxAIPGaAEw8+vDhiY3P/9QZ2ns6tWrYgRBaC6uaMdp6BZGGrcfFFIqDa0kc+DgrIhkiLC8leB5+S/vvq0f9zZeyZ527yy5NXGWA8o++c7QzvP8RMbxvtioxpUjM/gbGN6zTIO1gEje6UZqUU+2Pi64jc4WdMpv7dPLb//66nR3Rqvydby519u5+jFq101Y47tioxDzd0ND3ygZLDN3j0gCEaLxhUJVLJPb4rTNPTf3zD7aa5ECtiZuun+lte/15JicW/lX6xg0WwR8r3jDyF8TQ2E56D4A0FIFEghSQSLzpd3SemP7md0cAHFPEffvNH1EqLkRK8CXSl0jf/8tPvT41zW+U5oNf148/zaPyG9evI2Us3rDvxg++njQr5cVioP+HITTA5DeuPtkZHtpAvQbBHHIwZOUUL6tYnDrxuJEYQ4KuGvQZ10XHp1YxgUYdau1MluPiN7WcnP7+z55SDCiOfVXWqkipPI/0GzDAeMZ4MOrJsIxVRzbwkNTp5vGtcMTD07Wh4vg+1G3mWPkNmBHaJJG1GkyMXwMgit/91mHOuz2vi2o5C1HEZTC+ZENclYctNkwZ/wEvGuc3FLW0RbgQGeexzDhD7OTA86ZPi5FeoljvPHSpI0uTJ1KtZAOPB16wkI57JeKdkCn4MmSFtOpK026cVbGnXkNWK6otq34kHG9jCkOMLgdhpmJBjrHRDznScU6QdUO/aOPTGh7rBOmrNdnk2W3Z1DPx+OPXkePD+Aj81ln4E6PIyZLlDBkZHmqijhvZ+FHUj+ml+2SydJT7jWOX/Z2YGFtkqCSk1EuGJpK0t57qEVJaVLTKqIKaYxJhlzGPFQRgsohfKeMvPw/v8q/gfeos5OKj8fv7EX3vQDI9VZ/IO0yXlo4RnaTSP5hv9R/pJXeLsdUXbhCl4smAMiwOAGHl2GCOxoOjQIP5ID72BVCtIIsj+Md9Eu+slSQXLcax9hT1UonJJx5FrPk5IpEM65rdX0S/IDOaFBv7AnVukDpdpnMbHOn7zREqGcrot6K4QjdCxyBfBmM0KBMbAsHcIH2o15DDe6nPmAPXfI/MNd8kvXhJxHgAN5OhsngpddeL7gEM/XW70eFhdNMMOJhNKt4iRi89b6sol5YoSHzNJkUvgUI8kIgTtcttxc2sbzwe8byE4gH8bDN87vOkPn4qiZbWsK4lkxMT7H9pI94D95Lfsx3chKKsUcUEgjfhzsBSF5Qyhg2hzmr1l6nMG+LAZed3i4nx+SpFGS4N5cMerfYsWiEto3V6I+PLE8jqJHL5CpJnnk3y0Lk2loHU6nWG3nyT4rq15J9+gGxzKyKVNRZab+MkWzUVCJduLPAFUhgd1TAAkNl8jxj+3Mk7nGTqMIQTzOYqN2q8vdyrhLjhUQCEAGpV5Ng+5LGn4p13MamlR+I4we47EAmM9PYy8of1JNbdQU6W8ZracBw3KKHUCQEw+oVAWIZbxUK9rLcBIpHsFgO/+kW3WL92vjcxipNr1p2FjU7xVNBOo4ZRNJM+jA7gdy3CWXEp6RNPwstkwjYsKR44wNAzTyF/cwf5PdtItnUiPC8sEDHcmgBjhk9lhBWNOEtPgkKA63aLmu/vKe3YPnvivntw/3APbqENkmnLeNOiAGRDw1VQx4sjyFQGzrmU9PIzSM6cqetHpVIuM7TpVcpr15B9+THSbbNx0jZIjehuGRmsBo2AULoanQwIZhVAgBQOCKdb+L7fL4ToqFerjL28kfJdt+Bt3oDb1gWuF4FU2RkFQOgGKZeQpRFYfhHJs1eQPnzBVPYAdV8yvP1txh78HelH1pDJZnHzTQg9MQWGWOGpXj4YOLFLEgOC0Fc32vtS9dctqtVqxfO8hCleHh1l7Mk/Ur/jBhL7+3BaOsLKpgHb8FoNOdKLPGY5yQsuIf3BY3FtCmuRwNjevex//FHctbeRKw3htczCcd2APLIyCdUKpLLguAf3srEyAk5sHxCI5TQ9DHAEEtEt6vV62XGcZNCJNnCit5fxdWvhNzeSSGcR2WZNJTPOJRzYg9+5EO+i1WQ+9nES+XzYpyUT4+MM/ek56r++g9z2F0nO7MJJJA2lELUK/tggLDkBOrrgtRdg/24ozFAd2kCogP4vFjc2aAljDQBQ4W4xsHNnaUZXV9pxnBBpXdj3fcZf38LE3bfibrgTt+0wRCIFEyNIx0OsuJLsp88iNbszrGdJtVplaMsWJu67h8wz95Np7cDJ5BGOVsJMlh0LcFdeTvrDH8XJ5aj29VJ+8H7kI2sglddKx4zUhivHmzRrkgyrhEALoXY3AnOT3S1eXH3ZRPakj2W6lp9Gc3t70BCEbKiWSow9+zTV++7C2duLc9xHSZ+zkuyixeHQsMSXMNyzg5HfP0Dyd7eSTQi8phkI19GKgDQgnn0Z6dPOJDmrI9KGBIovPE/te/8XvEToxQZsUOrG46Fm0gCAskmtAhqAXZdfXKq8sDY9fvwK8heuYs6HjieTU1cDU4AYH8efLOG1tOCG00ZERgcHGXzicbjnl+SHdpCY0YXjeRp1AZUSjA/CJy8kec6FpBe+rzGIwNDmTTj//BVclMfsCS/wtGGGBUAQDERvhDT1g2VQON2i/6pLJ8WOralapcz4yCCTZ6xi5nkrmLVoMZ6ZzGJANJJSscjAi3+mvOY2cq8+TLrjCJxUOlh7hV9DDr+LPPITJC+8jPSxx+EmpgFx3z4GHn+M1H23k68VEa7+TabBpGizQaIOdMb4EIQQAKEB0CzoFv2XXTAidvc047rg16ns72c81YJ/0Wpmf+oMWru6lIdkuO21pVarse+NrYys/TWZh28m2zoHN9+M0PsDIUGO7kHOnId30RfJnHIqiaameDOgzwB7XvgTo3fcQmHjPRTmHoebSmuGhOPdBqER/dUdsFB5mv6gHGgACBjQd/7pB9zB3iaRKWgkJX6tSnngLcbffzKp/305nSd9lFxzs9FTdQzs37mTgYcexF1zI3m/SKJtjlrWDFmKI0i/inPeVWQ+ew7pOYdE2jBSq9fZt3Ur++5dQ/L+71PoWESyqQ3H0ZsXi9NmGESGgzHaLiP06qGXcDX5KQAUIwTSEd1i4PE/Fit33Zx1XnsMZ+ZCa/2VyMkik4NvMXHqappWXkz7kUeSSKUoDg/T/18bqNx+E4Xup0h3LsNNJMMOKiXk8FuI5VeSvmAVmSVLpxx30SAO79pF/0MP4t92PU2ySLp9Lq7nqnYsr6oKDYw3DWmQwrlAvaQ5l5jZHwfMTtAR3aImZam2f3965JGHqN5yHW5xANGiPaUb9scGKUmX8ifOhY7Z+JtfIf3MnWQ7l+BmcjjGcL+OHNwCSz9N6gtfJHfCR3BTKdVWTMaHh9m94UlKt95I4Z0nyB56DF4yhXC0xyyjiBkdjdtGW2BpkRg6GgDMRKhXgVq1WnI9Ly2B4o7tjN67Bv/uf8JpXojINqtrLQC/jj8+hD85jMh34mablLKaaozsQjZ3kbjk/5A/7XSSrW1RTbSUJyfpf2kj+++8leyjt5Kft4REroDjOOEUExiJ5dkwXQVDQEyxsKwMxr0qFTU+CkCtNu66bs40XK/VGH3lJcZ/dRPiidtw53wAEilQZFKFgiUFKA4jJ/pwL/o2uXMvIDN/vikVkbrvs2/bNvrX3ot757/Q1DaXdFsHjuuoCVNKdXSe3IdomgepXONND9MBFGOLRtMGQNgnQQNA3fcnHSFSQeu6YmVsjJEn/8jkTT/C3fkczqyjwJzlHYGoTCL730B8ajXZz19O/uhjGp71AYb7+uhd/xC1X/6YpvF3yHQuw0t4CKG9XhzGr07gfnY1Ttdcas9tQD53G6L9aKSX1JbaTFB/bECCxS/6UhMeBKdYaxOkANj56ivFjvcvyqbMeT0GxMTuPkZ+dx+1X1yLSxWRnQ1DPbDsVNKXX03hY6eQyOqNU0yKBw7Q+/RTjN7yc/IvP0L+8A+QSGfU7C4EVCbxB15DLr+K3MWXkTvyKBzHoTo2yviTj1O5/WcwOqSvxIyhWmLUn8IOU67RJgh1GEI43WLTys9NyKVHZ2afu4JZCxeGXrSA8KVkbOvrjD/4W9j9LskPfZjCaWeQnjUr6MaWSrnM7ldfYeDO20ndexNNCw4nVWjBdRX6wq/jD7yCv+h00pd+maaTPtbwwmT0ja0Uv3QBjusihX06NCWi22AVtAEwXo8BEA6DbtGz+gu12pO3uWOHHo+36kq6/vY0Wjr0vjzGBt/38atV3FSq4Tj3fZ+Bt9+m9/618ItraS60kJ45D08vawKQI7uop9tIXPYPNJ1xJumZ+vwRk0q5zMAzT+N85xoc19NbYQLTbMNVqMEcIMNzAGg7hFoGEQ44TrfYeeUXamzd6PrCobx7C8Xjz6fw+cvoOuFEMuZ4GwMCa5IxMtzfz84/rKf08x/TtHsLuXkfIJFMhEtkaYT68A7Ehd+maeXF5BYcMS2Ie996i7333Uth3c1km2YGc0/kuNto4jNZDQBQ0WDsh0OgZ/WqGls3uuYazB8foTjYTeX8r9G+8iI6ly6deibAmiPGxtj57DMM3XITufUP0rTsCJKZrFrWHAHVMn7fG/DJVeQuuZKmY/+m4YUJwPCePfSsf5jijf9B675tFOZbfUe6tyhvh6eMf4KfdSNbYIQCVYhu8eYXLqgn/3yP484+Bil9dfvr+1SH3mEsNQvn0ms45MzPMGPevIjHqpUKfZs303v3HSR+9p80L+kg3dyO6zg4jjrryz1b8Bd8hPTqr9Ly8U+SnO7CZHSUnc8+w76bbyT70MM0f3ABqWxOb4VDsYdAwIAg3AiA6eYAaxXYu+W18sg9dyXlHf9Ocs4CRCaP8PVWuFal/O42xo/8BLlLv0jnRz5CKp9npK+PnQ+so/rTr9Pi+mTnLMZz3WAzI4d7qOOQWP2vtJ51DtnOaS5MKhX6Nm/i3Ttvx/vpDbQs6yDd0o7nqL0B2gRjqJRWPKA+YQkrLMItXOh1PfYNE4TjdIu6lFW/UvEGnn+OAzf9BHfDOpILFiEd9WsMSPzSOJP9Oymd8Blqszqpb3qRzLZXyS84gkQyFSxronSA+u5diFVfo+XiS2havKThOJdSMrB9O92/vY/K9V+nJQW5zsUkPC/YCquC6k9gSODwEADsJVC3rcT8IqT/BCAoFggzBGrV6qTreSmA0vAwe9c/xMRP/o3k4Fs4s5eoOlJB7U+OUS+PIjIzcJJpXEeo29x6BX/7W8hTz6Hwd1+i9fgT8ZLWD5qWHBgYYMdjjzJyw3UUtrxK05KFJJPJ2FY4LK+CtsEGlwCNSBmrmA4bz08HQK1Wcl03bc/sI93dDPz6bmrXXUtyVitOc2fQYaCk2b72vUl97jKyV32dtr/9FOmWlkABW0rj4+z80/Ps/uUvSP/mflqOOpR0roDrWobbEjEmbmwIgAIjLGMRAKkGv46HLJBmiEXOArEZvl6vM/jKywzdfAPOzbeTOGYuIhUcGWBkB7VimeTV32fGuSspzJ2r0i0gAWrVGn2vb6H77jvhP66jdWGO7IxD8VxHHZHjxoe2xtLiBquAHY8ODYEMfs/Txus5IADDcbvF5gcfGJx3/AkzprsQLY+Ps/fJxxn7yffxnngBpxP8PeB+5Yu0XnIFrXr7GtTV9SSwr6ebd9atY+K6b9FSmiA/fyEJz9NzhqoSkYjVoSgjo5mRFSEWl9LoL8OLEIv+AQBeolv86ZT/ta8094iZcy65gvnHHUfK7OtjQIzt2c3Qhiep9+8h98FjmHH8iSSmOT+MDg7yzhOPs++G68k//QLNR88jldZzxhSXH1yidloGBhK7AzDLY+CI8EIktg2GZKpbvPnZ5b3l/37pkAMH9sMV3+Lw81fSuWgRrr7aihsnNaka5U1OTNDz4p/ZecsvSd61hpZFM8kU2vBc0fBG6C9J1G7L27FMO67CDQAIfhPQmyCAQmuP++XFR1zl1v3WTNNMeOq39P3xCQbdNJnOTrKFQtCQkeACREVACOq1Gr1bt7Lphp8xfPkVtA5tofV9C0hncuoAFFHfiKJoI5HxHCtib37Cl7UvQJr9r1VNG6+CoQuT6b3uVQvnX8HE+CwhHBJN7WRqk0zefBe7tv83E4Um8rNnk0ynpwBh4oPvvsumNXez8+rLyf/+UWYcNY9cczue6yp8dHFjVGhc1PhonhIho3SP1DvoihAUCdQO5wX9CCCZ7nWvWrpolRwb7gKBlBLHcUnPmUG6902Gf3or7xbHYGY7+fZ2tYfXXh8bHmbrI+vZeu3Xcf7zRtpnFyjM7SDhTTW8sdgMaMyG0EDzZzpDjdetfJji+Sm9ZfJvu39/SPtyWal8APSHEVIh76ZypDtacJ9/jD333ky/U8BpbqZaqbDz1VfY9MMfUPzHbzDT76dl/qGkkilc/VtAIFpno7pSIMakiCiCS7THwkpWiSgCVjCor/6ofuzq4eceChiRLbwsXj/tpB/IkaGv4UsE6ksrpFQbSalAqdcqFLf2Mn54B9XZ8+DZF2lqhVzXXJKupw9WYaeR0MHsfS+iLQgNCRMi2NjDwDbe/BhiaG/2AY6D09F1nSOF2CyF+i3F9xWGUrNB6hsY101QWHYYs1Iuswe207m0i+a580nqcS6l+bworOebsC+DT4/e82M+PvVjbUm15Jkv74I0X6Vr34V1jBPN4Q5dB/W7gHTdzY4stGyUwi2jK0SNMBUkIHG9JMlMgYTr4QiNsdbWrmssCdrC/jQ22kf00WUwz3TtmX7DuEozbSh9A1AiQCi2SOGUZTL5ggDY9NFjNzAxdrJAFcL6HFZKGX4hJi2CWYO9Md1jW56/ZihEuG2iVqIORopJbRxaN6nvAfTMHxyBzW4w1/RfRz/10ikOgJ/N/0Q6Lr5GSCEXIu5rYCL0sjzqE6epyvelr+qatODLTutth81b11HtTmWOb3Sy9DCUN+3Y/SrdFGC+lEjHhVz+emy/vHz6KU+K3T2nqO8FQ9opr2vPG4h1rakePshG18qYrkzUo3YklIANUwkRMsOmpPZ85MnkHjrmuc1nYv8/Q5MnnPwP/pzDqtQqoRd0m4HndWrDyUl/p+vH0+18/fjTPHaZeH3VrvneN+5dXcfMHFIGHldPWJ50bh/tnV82dgcAfPjab79UXfD+i/18W516NTBaVQ+JYDeIIUkMKOLGSwNoDNgpj/UvVl+1ObU/pUPYpq0T6Dyjl5eYlLMPueiYdX/oMXZPYeOzV125Krlty21O39tILx0UkqhWVQXTvJII8RsH/78k0psVUWZbcesCRK39JsNHFNrGZNuMFcet3/CIVUV9fmPLrza+tHnFlX//lvCdU5zB/oyoTCAdNzBSIR+1MkDfTjRlrS3oXyPGwzETw7xoUrDRMZoph/mQzMAhh7/hz53/mQ/d99AzppqRaZ207p417yu8tPF7qXe2ne3tegfnwB5EbRISWUjkkK6nOagbmbalaTNCb2ljG8s0GTY4QiDqNaiMKSC8NDLXisw39cn5C28pfeasH3/8vBXD0QaUHEQ7Jb+77daT0j09FyT2D57ijh5Y6O4fcr2BPrzRIb3eiqlKWoY1ltBP0VKNjY2khlaHy5L0qTXNpNY5FzLZQZkvvCYLhXX1+Yfd+4kvXz1g1Z4i/wOdKufzRJ242gAAAABJRU5ErkJggg==",
              width: "24px",
              height: "24px",
              style: { marginRight: "8px" },
            }),
            Text(
              {
                bold: true,
                style: { color: "#ffffff", fontSize: "13px" },
              },
              "Todoist Integration"
            ),
          ]
        ),
        Text(
          {
            paragraph: true,
            style: { color: "#aaaaaa", fontSize: "12px", marginBottom: "8px" },
          },
          "Authorise DuDu to create tasks from your recordings"
        ),
        Auth({
          label: "Connect Todoist",
          authorizeUrl: "https://app.todoist.com/oauth/authorize",
          requestTokenUrl: "https://api.todoist.com/oauth/access_token",
          clientId: _CLIENT_ID,
          clientSecret: _CLIENT_SECRET,
          scope: "task:add",
          onAccessToken({ access_token }) {
            props.settingsStorage.setItem("dudu_todoist_key", access_token);
          },
        }),
      ]
    );

    // --- Language section ---
    if (!props.settingsStorage.getItem("dudu_language")) {
      props.settingsStorage.setItem("dudu_language", _DEFAULT_LANG);
    }
    const currentLanguage = props.settingsStorage.getItem("dudu_language");

    const languageConfig = Section(
      {
        style: {
          marginBottom: "16px",
          borderBottom: "1px solid #333333",
          paddingBottom: "16px",
          backgroundColor: "#1a4a8a",
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
          backgroundColor: "#1a4a8a",
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
            backgroundColor: "#1a4a8a",
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
          backgroundColor: "#1a4a8a",
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
