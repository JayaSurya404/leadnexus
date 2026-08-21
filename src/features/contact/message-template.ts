type TemplateVariables = {
  businessName: string;
  productName: string;
};

export function resolveContactMessage({
  productTemplate,
  businessTemplate,
  businessName,
  productName,
}: {
  productTemplate?:
    | string
    | null;

  businessTemplate?:
    | string
    | null;

  businessName: string;

  productName?:
    | string
    | null;
}) {
  const fallback =
    productName
      ? `Hi ${businessName},\nI'm interested in the ${productName}.\nPlease share pricing details, availability and the next steps.`
      : `Hi ${businessName},\nI'm interested in learning more about your products/services.\nPlease share pricing details, availability and the next steps.`;

  const selectedTemplate =
    productTemplate ??
    businessTemplate;

  if (
    !selectedTemplate?.trim()
  ) {
    return fallback;
  }

  return renderContactTemplate(
    selectedTemplate,
    {
      businessName,
      productName:
        productName ??
        "your products or services",
    },
  );
}

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
