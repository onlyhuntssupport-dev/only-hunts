import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(request: Request) {
  try {
    const { token, title, body } = await request.json();

    // --- SECURE AUTHORIZATION ---
    // Instead of hardcoding, we use the credentials from your JSON file
    const auth = new GoogleAuth({
      credentials: {
        client_email: "firebase-adminsdk-fbsvc@studio-7444078196-d8a54.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkWEYeBlsGNmPk\nTJjMlNPVn9tvoijjZOYFiQsahlA2kBLPOfZu1iIgFJTYbhZULZvWsU1qpaIcWXUc\nliEGrWDXQsN0Dkcwhk8eQROvAslwqGG3yihBV9wwIGzsE6+jTTfg1GvY5XzbdbDg\nP7dA4TH7NSw4phkgILR9jCnYcQExafRKwJV9i5oPwqFn2Na5hm19ZLETu/A8m3FF\nZ8HLHGDfcmeoRmHSDXEPVCgjRN3ZwKLzPmxx9LNdsIpAbsKeua43x1IsP8B7lTe3\n2cQ5qXK/CkxvzANhfuiV63KxW3wehMEGCW/+RCTVSnqstQXjnPZUZhpQPAOSinM0\n0EkEzRJ5AgMBAAECggEASl1jRPzNPW9pHgoG7jO98yFFsyrmY5bpesG7U4JJU5c3\n26s3tomQoYGOpKyTz/1fUfOiu0o9o6RbGNdaFGJpup4MQTygu/VaYa9Cz+Nr8V1P\n8lE4i/DMwr45a02xISy0xzh3oIqfR9LmeWJ7cpE0A57Y5r1KCz6hTVoaKUVhK9Ez\nLrmZ29xi4Br79ZPVn3vgbE4PkpQuaYVrgMD3d2UbjMwT5MJJAtZE2zgSArNWHFk3\nAuq/toBJ+fjm/5PoqEpoBc5IQZJDNe6HHaQkCx9RFNEAcgSjULEBHC0Qa0l9agxM\nKA0N/mkz9p0fhJLAQNlPgX9PIJZqa4MAKBAJ/RnmbQKBgQDT2OGfy8w17z68Ae9S\nJEYleH2/5BunBOPGnjYPlW00z4cbEWdh/9xmT0p1cIcmlQeiADQpzeo6v1CFFEnB\nTWxe7W9vVa5iV/5xYOgZxaJU46IjD8LyVB83N+kI76G5BZDHkFfbuXyL/p9TdYAe\nON5vCwtgi2o1TDESB1D+VBm/zwKBgQDGmOacoLIz6N7iGq5HeomZT5QhbZxBMR+j\nNdXVq1mzfcogcY81yE4IbrGFyOOs02HhXIzFctOOFfAQbNr6fwCh15rMAZRkGjvE\n9zBbymcOxB+/wUfxky0tMRnhShiB7xQnsWdSMwVMt8EjqWEUWlFow2dgLAAcavTW\nplN/gw+TNwKBgA+mAJyWKEJ/pqmqluwBY/EWomtPRT+kG9MrEqE6D3QMNFWqhnF1\nvekMyFo+cq1F6udrjm7cGAY45ZC+++e8eVnVvhqCQLxg9ZmYZ+ynbaNJoUtnuaW+\n0wN4LM2NLewF3jjvj53aaLnKmChJEKqq1rtrHG8IPVMsip9jTPdMbQ5/AoGAHmvX\nj5CSG5+FXM9HeQ2NPF3TTBeVQus6dG7Pta5MzFDtgHDExjFLusDyEpNGRPgQW0wp\nCCnhvDciEfIKzSpdN21mee+YAol+NFrFHppvlPR4BJCf66Jm3jBSTY9jF6w+wyHK\nuO211x2iyUqt40c+hzS/hhzXW4MKxEKwMa0q2psCgYB3ObcJI3AS2KjlRUE4Q+La\nsgAJ6kzpmBuirbujwrLQqNq9AxyhKK9/7V0SmNCZEyuNtj+oTrIlTmUJIuxCuyO5\n7u68f9yI84DbYebufq0WGqxvs/u1BiSw2bgMQdj7hIUTce/MTYINkUL9Zw2XRUeC\nyBmDRjggkot6566xOltIbA==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'), // Fixes formatting
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await auth.getAccessToken();
    const projectId = "studio-7444078196-d8a54";

    // --- SEND VIA HTTP v1 API ---
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: title,
              body: body,
            },
          },
        }),
      }
    );

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Push Error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}