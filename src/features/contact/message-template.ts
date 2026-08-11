type TemplateVariables = {
  businessName: string;
  productName: string;
};

export function renderContactTemplate(
  template: string,
  variables: TemplateVariables,
) {
  return template
    .replaceAll(
      "{{business_name}}",
      variables.businessName,
    )
    .replaceAll(
      "{{product_name}}",
      variables.productName,
    );
}

export function buildWhatsappUrl(
  phone: string,
  message: string,
) {
  const digits =
    phone.replace(
      /\D/g,
      "",
    );

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    message,
  )}`;
}

export function buildEmailUrl({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) {
  return `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(
    message,
  )}`;
}

export function buildPhoneUrl(
  phone: string,
) {
  const normalized =
    phone.replace(
      /[^+0-9]/g,
      "",
    );

  return `tel:${normalized}`;
}