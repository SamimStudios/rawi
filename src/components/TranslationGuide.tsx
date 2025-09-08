import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Translation Guide Component
 * 
 * This component serves as documentation for maintaining translations
 * in the Rawi App. It should be used as a reference for developers.
 */
const TranslationGuide = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-primary">Translation System Guide</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">✅ ALWAYS DO (Required)</h2>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
              <p><strong>1. Use the `t()` function for ALL text:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`// ✅ Correct
<h1>{t('heroHeadline')}</h1>
<Button>{t('getStarted')}</Button>`}
              </pre>
              
              <p><strong>2. Add translations to BOTH languages in LanguageContext.tsx:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`// ✅ Add to both en: and ar: objects
en: {
  newFeature: 'New Feature',
  // ... other translations
},
ar: {
  newFeature: 'ميزة جديدة',
  // ... other translations
}`}
              </pre>
              
              <p><strong>3. Import and use the useLanguage hook:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t, isRTL } = useLanguage();
  
  return <div>{t('myText')}</div>;
};`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-destructive">❌ NEVER DO (Forbidden)</h2>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-2">
              <p><strong>1. Hardcode English text:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`// ❌ Wrong - hardcoded English
<h1>Welcome to Rawi</h1>
<Button>Sign Up</Button>

// ✅ Correct - using translations
<h1>{t('welcomeMessage')}</h1>
<Button>{t('signUp')}</Button>`}
              </pre>
              
              <p><strong>2. Add translations to only one language:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`// ❌ Wrong - missing Arabic translation
en: { newButton: 'Click Me' }
// Arabic translation missing!

// ✅ Correct - both languages
en: { newButton: 'Click Me' }
ar: { newButton: 'انقر هنا' }`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">🎯 RTL Support Best Practices</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <p><strong>1. Use isRTL for conditional styling:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`const { isRTL } = useLanguage();

// For margins/padding
className={cn("flex items-center", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}

// For icons
<Icon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />`}
              </pre>
              
              <p><strong>2. Use the RTL utility classes in CSS:</strong></p>
              <pre className="bg-background p-2 rounded text-sm">
{`// Use space-x-reverse for RTL spacing
className="flex space-x-4 space-x-reverse"

// Use text-right for RTL text alignment  
className={isRTL ? "text-right" : "text-left"}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">📝 Quick Checklist for New Features</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> All text uses `t()` function
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> English translations added to `en:` object
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> Arabic translations added to `ar:` object
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> RTL layout tested and working
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> Spacing and icons work in both directions
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> No hardcoded English strings remain
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">🔧 Common Translation Keys Available</h2>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              <p className="mb-2">Here are commonly used translation keys you can use immediately:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>• loading, error, success</div>
                <div>• cancel, confirm, delete</div>
                <div>• edit, view, close</div>
                <div>• next, previous, back</div>
                <div>• continue, apply, reset</div>
                <div>• email, password, submit</div>
                <div>• required, optional</div>
                <div>• signIn, signUp, signOut</div>
                <div>• dashboard, settings</div>
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default TranslationGuide;
