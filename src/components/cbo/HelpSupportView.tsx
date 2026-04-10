import { HelpCircle, Book, MessageCircle, PhoneCall, Mail, ExternalLink } from 'lucide-react';

export function HelpSupportView() {
  const supportCategories = [
    { title: 'Documentation', description: 'Read detailed guides and API documentation.', icon: Book, link: 'Browse Docs' },
    { title: 'Community Forum', description: 'Discuss features and get help from other users.', icon: MessageCircle, link: 'Join Forum' },
    { title: 'Contact Support', description: 'Create a ticket and our team will get back to you.', icon: Mail, link: 'Email Support' },
    { title: 'Live Chat', description: 'Available Mon-Fri, 9am - 5pm EST.', icon: PhoneCall, link: 'Start Chat' }
  ];

  return (
    <div className="w-full">
      <div className="mb-4 md:mb-6">
        <h1 className="text-[22px] md:text-[24px] font-bold text-gray-900 mb-1 leading-tight">Help & Support</h1>
        <p className="text-[13px] md:text-[14px] text-gray-500">Find answers or reach out to our team for assistance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 mb-6 md:mb-8">
        {supportCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl md:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 p-4 md:p-6 flex flex-col">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] md:text-[16px] font-semibold text-gray-900 leading-tight">{cat.title}</h3>
                  <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5">{cat.description}</p>
                </div>
              </div>
              <div className="mt-auto pt-3 md:pt-4 border-t border-gray-50">
                <button className="flex items-center gap-2 text-[13px] md:text-[14px] font-medium text-teal-600 hover:text-teal-700 transition-colors min-h-[44px]">
                  {cat.link}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl md:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 p-6 md:p-8 text-center max-w-3xl mx-auto">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 mx-auto flex items-center justify-center mb-4">
          <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
        </div>
        <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 mb-2 md:mb-3">Frequently Asked Questions</h2>
        <p className="text-[13px] md:text-[14px] text-gray-500 mb-5 md:mb-6 max-w-lg mx-auto">Explore our knowledge base to find quick answers about HealthPowr.</p>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-all min-h-[44px] mx-auto">
          Visit Knowledge Base
        </button>
      </div>
    </div>
  );
}
